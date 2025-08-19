import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice.js";
import employeeReducer from "./slices/employeeSlice.js"
const store = configureStore({
  reducer: {
    auth: authReducer,
    employees: employeeReducer
  },
});

export default store;