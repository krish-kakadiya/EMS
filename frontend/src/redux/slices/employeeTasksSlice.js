import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../axios/api.js';

export const fetchMyTasks = createAsyncThunk('employeeTasks/fetchMyTasks', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/tasks/me/my-tasks');
    return res.data.tasks;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to load tasks');
  }
});

export const updateMyTaskStatus = createAsyncThunk('employeeTasks/updateStatus', async ({ id, status, message }, { rejectWithValue }) => {
  try {
    const res = await api.patch(`/tasks/me/${id}/status`, { status, message });
    return res.data.task;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to update task');
  }
});

const employeeTasksSlice = createSlice({
  name: 'employeeTasks',
  initialState: { tasks: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyTasks.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchMyTasks.fulfilled, (state, action) => { state.loading = false; state.tasks = action.payload; })
      .addCase(fetchMyTasks.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(updateMyTaskStatus.fulfilled, (state, action) => {
        const idx = state.tasks.findIndex(t => t._id === action.payload._id);
        if (idx !== -1) state.tasks[idx] = action.payload; else state.tasks.push(action.payload);
      });
  }
});

export default employeeTasksSlice.reducer;
