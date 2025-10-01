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

export const deleteMyTask = createAsyncThunk('employeeTasks/deleteTask', async (id, { rejectWithValue }) => {
  try {
    const res = await api.delete(`/tasks/me/${id}`);
    return { id, message: res.data.message };
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to delete task');
  }
});

export const leaveMyTask = createAsyncThunk('employeeTasks/leaveTask', async (id, { rejectWithValue }) => {
  try {
    const res = await api.post(`/tasks/me/${id}/leave`);
    return { id, task: res.data.task };
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to leave task');
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
      })
      .addCase(deleteMyTask.fulfilled, (state, action) => {
        state.tasks = state.tasks.filter(t => t._id !== action.payload.id);
      })
      .addCase(leaveMyTask.fulfilled, (state, action) => {
        // Remove the task from employee's personal list because they are no longer assigned
        state.tasks = state.tasks.filter(t => t._id !== action.payload.id);
      });
  }
});

export default employeeTasksSlice.reducer;
