import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../axios/api.js"; 

// -------------------------------------------------
// Thunks (Async actions)
// -------------------------------------------------

// Create employee
export const createEmployee = createAsyncThunk(
  "employees/create",
  async (employeeData, { rejectWithValue }) => {
    try {
      const res = await api.post("/employees/create", employeeData);
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Get all employees
export const getAllEmployees = createAsyncThunk(
  "employees/getAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/employees");
      return res.data.employees;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Delete employee
export const deleteEmployee = createAsyncThunk(
  "employees/delete",
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.delete(`/employees/${id}`);
      return { id, ...res.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Get total monthly pay
export const getMonthlyPay = createAsyncThunk(
  "employees/monthlyPay",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/employees/monthly-pay");
      return res.data.totalMonthlyPay;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// -------------------------------------------------
// Slice
// -------------------------------------------------
const employeeSlice = createSlice({
  name: "employees",
  initialState: {
    employees: [],
    monthlyPay: 0,
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
      // Create employee
      .addCase(createEmployee.pending, (state) => {
        state.loading = true;
      })
      .addCase(createEmployee.fulfilled, (state, action) => {
        state.loading = false;
        state.success = action.payload.message;
        state.employees.push(action.payload); // add new employee to state
      })
      .addCase(createEmployee.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to create employee";
      })

      // Get all employees
      .addCase(getAllEmployees.pending, (state) => {
        state.loading = true;
      })
      .addCase(getAllEmployees.fulfilled, (state, action) => {
        state.loading = false;
        state.employees = action.payload;
      })
      .addCase(getAllEmployees.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to fetch employees";
      })

      // Delete employee
      .addCase(deleteEmployee.fulfilled, (state, action) => {
        state.employees = state.employees.filter(
          (emp) => emp._id !== action.payload.id
        );
        state.success = action.payload.message;
      })
      .addCase(deleteEmployee.rejected, (state, action) => {
        state.error =
          action.payload?.message || "Failed to delete employee";
      })

      // Get monthly pay
      .addCase(getMonthlyPay.fulfilled, (state, action) => {
        state.monthlyPay = action.payload;
      })
      .addCase(getMonthlyPay.rejected, (state, action) => {
        state.error =
          action.payload?.message || "Failed to fetch monthly pay";
      });
  },
});

export const { clearMessages } = employeeSlice.actions;
export default employeeSlice.reducer;
