
import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  ClipboardList,
  LogOut,
} from "lucide-react";

import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navigation = [
    {
      name: "Dashboard",
      path: "/",
      icon: LayoutDashboard,
    },
    {
      name: "Products",
      path: "/products",
      icon: Package,
    },
    {
      name: "Inventory",
      path: "/inventory",
      icon: ArrowLeftRight,
    },
    {
      name: "Transaction Ledger",
      path: "/ledger",
      icon: ClipboardList,
    },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <aside className="flex min-h-screen w-64 flex-col bg-slate-900 text-white">
      <div className="border-b border-slate-700 px-6 py-6">
        <h1 className="text-xl font-bold">InventoryPro</h1>
        <p className="mt-1 text-xs text-slate-400">
          Inventory Management System
        </p>
      </div>

      <nav className="flex-1 space-y-2 px-4 py-6">
        {navigation.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`
              }
            >
              <Icon size={19} />
              {item.name}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-slate-700 p-4">
        <p className="truncate px-3 text-sm font-medium">
          {user?.name || user?.email || "User"}
        </p>

        <button
          onClick={handleLogout}
          className="mt-3 flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
