import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../axios/api.js";

// 🔹 Login
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (credentials, { rejectWithValue }) => {
    try {
      const res = await api.post("/auth/login", credentials);
      return res.data; // { user }
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: "Login failed" });
    }
  }
);

// 🔹 Get current user
export const getCurrentUser = createAsyncThunk(
  "auth/getCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/auth/me");
      return res.data; // { user }
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: "Not authenticated" });
    }
  }
);

// 🔹 Logout
export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, { rejectWithValue }) => {
    try {
      await api.post("/auth/logout");
      return true;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: "Logout failed" });
    }
  }
);

// 🔹 Change Password
export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await api.post('/auth/change-password', payload);
      return res.data; // { success, message }
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Change password failed' });
    }
  }
);

// 🔹 Reset Password (forced after OTP)
export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await api.post('/auth/reset-password', payload);
      return res.data; // { success, message }
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Reset password failed' });
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    loading: false,
    error: null,
    changingPassword: false,
    changePasswordMessage: null,
    resettingPassword: false,
    resetPasswordMessage: null,
  },
  reducers: {
    clearChangePasswordState: (state) => {
      state.changingPassword = false;
      state.changePasswordMessage = null;
      state.error = null;
    },
    clearResetPasswordState: (state) => {
      state.resettingPassword = false;
      state.resetPasswordMessage = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // login
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message;
      });

    // get current user
    builder
      .addCase(getCurrentUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
      })
      .addCase(getCurrentUser.rejected, (state) => {
        state.loading = false;
        state.user = null;
      });

    // logout
    builder.addCase(logoutUser.fulfilled, (state) => {
      state.user = null;
    });

    // changePassword
    builder
      .addCase(changePassword.pending, (state) => {
        state.changingPassword = true;
        state.changePasswordMessage = null;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state, action) => {
        state.changingPassword = false;
        state.changePasswordMessage = action.payload.message || 'Password changed';
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.changingPassword = false;
        state.error = action.payload?.message || 'Change password failed';
      });

    // resetPassword
    builder
      .addCase(resetPassword.pending, (state) => {
        state.resettingPassword = true;
        state.resetPasswordMessage = null;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.resettingPassword = false;
        state.resetPasswordMessage = action.payload.message || 'Password reset successful';
        // Clear flag on user if present
        if (state.user) {
          state.user.passwordResetRequired = false;
        }
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.resettingPassword = false;
        state.error = action.payload?.message || 'Reset password failed';
      });
  },
});

export const { clearChangePasswordState, clearResetPasswordState } = authSlice.actions;
export default authSlice.reducer;
