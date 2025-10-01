import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice.js";
import employeeReducer from "./slices/employeeSlice.js";
import leaveReducer from "./slices/leaveSlice.js";
import employeeTasksReducer from "./slices/employeeTasksSlice.js";
const store = configureStore({
  reducer: {
    auth: authReducer,
    employees: employeeReducer,
    leave: leaveReducer,
    employeeTasks: employeeTasksReducer
  },
});

export default store;