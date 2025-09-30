import Counter from '../model/counter.model.js';

// Atomic sequential code generator using findOneAndUpdate with upsert.
export const generateSequentialCode = async (key, prefix) => {
  const result = await Counter.findOneAndUpdate(
    { role: key },
    { $inc: { count: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return `${prefix}${String(result.count).padStart(3, '0')}`;
};
