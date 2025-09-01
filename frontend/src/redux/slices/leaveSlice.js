import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../axios/api.js";

// 🔹 Employee APIs
export const applyLeave = createAsyncThunk(
  "leave/applyLeave",
  async (leaveData, { rejectWithValue }) => {
    try {
      const res = await api.post("/leaves/apply", leaveData);
      return res.data.leave;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to apply leave");
    }
  }
);

export const getMyLeaves = createAsyncThunk(
  "leave/getMyLeaves",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/leaves/my-leaves");
      return res.data.leaves;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch leaves");
    }
  }
);

export const updateLeave = createAsyncThunk(
  "leave/updateLeave",
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/leaves/${id}`, updates);
      return res.data.leave;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to update leave");
    }
  }
);

export const deleteLeave = createAsyncThunk(
  "leave/deleteLeave",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/leaves/${id}`);
      return id; // return deleted leave id
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to delete leave");
    }
  }
);

// 🔹 Admin APIs
export const getAllLeaves = createAsyncThunk(
  "leave/getAllLeaves",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/leaves/all");
      return res.data.leaves;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch all leaves");
    }
  }
);

export const updateLeaveStatus = createAsyncThunk(
  "leave/updateLeaveStatus",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/leaves/${id}/status`, { status });
      return res.data.leave;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to update leave status");
    }
  }
);

const leaveSlice = createSlice({
  name: "leave",
  initialState: {
    myLeaves: [],
    allLeaves: [], // for admin
    loading: false,
    error: null,
    success: null,
  },
  reducers: {
    clearMessages: (state) => {
      state.error = null;
      state.success = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Apply Leave
      .addCase(applyLeave.pending, (state) => {
        state.loading = true;
      })
      .addCase(applyLeave.fulfilled, (state, action) => {
        state.loading = false;
        state.success = "Leave applied successfully";
        state.myLeaves.unshift(action.payload);
      })
      .addCase(applyLeave.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get My Leaves
      .addCase(getMyLeaves.pending, (state) => {
        state.loading = true;
      })
      .addCase(getMyLeaves.fulfilled, (state, action) => {
        state.loading = false;
        state.myLeaves = action.payload;
      })
      .addCase(getMyLeaves.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update Leave
      .addCase(updateLeave.fulfilled, (state, action) => {
        state.success = "Leave updated successfully";
        state.myLeaves = state.myLeaves.map((leave) =>
          leave._id === action.payload._id ? action.payload : leave
        );
      })
      .addCase(updateLeave.rejected, (state, action) => {
        state.error = action.payload;
      })

      // Delete Leave
      .addCase(deleteLeave.fulfilled, (state, action) => {
        state.success = "Leave deleted successfully";
        state.myLeaves = state.myLeaves.filter((leave) => leave._id !== action.payload);
      })
      .addCase(deleteLeave.rejected, (state, action) => {
        state.error = action.payload;
      })

      // Get All Leaves (Admin)
      .addCase(getAllLeaves.pending, (state) => {
        state.loading = true;
      })
      .addCase(getAllLeaves.fulfilled, (state, action) => {
        state.loading = false;
        state.allLeaves = action.payload;
      })
      .addCase(getAllLeaves.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update Leave Status (Admin)
      .addCase(updateLeaveStatus.fulfilled, (state, action) => {
        state.success = "Leave status updated successfully";
        state.allLeaves = state.allLeaves.map((leave) =>
          leave._id === action.payload._id ? action.payload : leave
        );
      })
      .addCase(updateLeaveStatus.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearMessages } = leaveSlice.actions;
export default leaveSlice.reducer;
