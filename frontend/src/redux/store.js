import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice.js";
import employeeReducer from "./slices/employeeSlice.js"
import leaveReducer from "./slices/leaveSlice.js"
const store = configureStore({
  reducer: {
    auth: authReducer,
    employees: employeeReducer,
    leave: leaveReducer
  },
});

export default store;