
import { Navigate, Route, Routes } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Inventory from "./pages/Inventory";
import Ledger from "./pages/Ledger";

import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";

const App = () => {
  return (
    <Routes>
      {/* Public route */}
      <Route path="/login" element={<Login />} />

      {/* Protected application routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          {/* Dashboard */}
          <Route
            path="/"
            element={<Dashboard />}
          />

          {/* Products management */}
          <Route
            path="/products"
            element={<Products />}
          />

          {/* Inventory management */}
          <Route
            path="/inventory"
            element={<Inventory />}
          />

          {/* Transaction ledger */}
          <Route
            path="/ledger"
            element={<Ledger />}
          />
        </Route>
      </Route>

      {/* Redirect unknown routes */}
      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  );
};

export default App;
