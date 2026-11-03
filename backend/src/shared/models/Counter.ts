import { Schema, model, Document } from 'mongoose';

export interface ICounter extends Document {
  _id: string;
  seq: number;
}

const CounterSchema = new Schema<ICounter>({
  _id: { type: String, required: true },
  seq: { type: Number, required: true, default: 0 },
});

export const Counter = model<ICounter>('Counter', CounterSchema);
