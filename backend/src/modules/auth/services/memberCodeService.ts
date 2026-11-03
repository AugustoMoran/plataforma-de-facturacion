import { Counter } from '../../../shared/models/Counter';
import { User } from '../models/User';

const MEMBER_CODE_SEQUENCE = 'memberCode';

export const MEMBER_CODE_START = 100;

/**
 * Devuelve el próximo "código de socio" único y autoincremental.
 * El primer código entregado es MEMBER_CODE_START (100) y luego crece de a 1.
 * Usa operaciones atómicas de Mongo para ser seguro ante creaciones concurrentes.
 */
export async function getNextMemberCode(): Promise<number> {
  // Garantiza que el contador nunca arranque por debajo de (inicio - 1),
  // así el primer $inc entrega exactamente MEMBER_CODE_START.
  await Counter.updateOne(
    { _id: MEMBER_CODE_SEQUENCE },
    { $max: { seq: MEMBER_CODE_START - 1 } },
    { upsert: true }
  );

  const counter = await Counter.findOneAndUpdate(
    { _id: MEMBER_CODE_SEQUENCE },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  return counter!.seq;
}

/**
 * Asigna un código de socio a los usuarios existentes que todavía no tienen uno,
 * respetando el orden de creación, y sincroniza el contador con el máximo actual.
 * Idempotente: si todos ya tienen código, no hace nada.
 */
export async function backfillMemberCodes(): Promise<number> {
  const maxDoc = await User.findOne({ memberCode: { $ne: null } })
    .sort({ memberCode: -1 })
    .select('memberCode')
    .lean();

  const currentMax = Number(maxDoc?.memberCode) || 0;
  const base = Math.max(MEMBER_CODE_START - 1, currentMax);

  await Counter.updateOne(
    { _id: MEMBER_CODE_SEQUENCE },
    { $max: { seq: base } },
    { upsert: true }
  );

  const missing = await User.find({
    $or: [{ memberCode: { $exists: false } }, { memberCode: null }],
  })
    .sort({ createdAt: 1, _id: 1 })
    .select('_id');

  let assigned = 0;
  for (const user of missing) {
    const code = await getNextMemberCode();
    await User.updateOne({ _id: user._id }, { $set: { memberCode: code } });
    assigned += 1;
  }

  return assigned;
}
