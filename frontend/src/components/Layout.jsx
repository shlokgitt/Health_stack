import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navigation = [
  {
    name: "Dashboard",
    path: "/",
    icon: "▦",
  },
  {
    name: "Map",
    path: "/map",
    icon: "⌖",
  },
  {
    name: "Inventory",
    path: "/inventory",
    icon: "▤",
  },
  {
    name: "Recommendations",
    path: "/recommendations",
    icon: "↗",
  },
];

export default function Layout() {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              HealthResilience
            </h1>

            <p className="text-xs text-slate-500">
              Smart Health & Supply Chain Resilience
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 sm:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              System Online
            </div>
            
            {user && (
              <div className="flex items-center gap-3 border-l pl-4 border-slate-200">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-slate-800 uppercase">{user.phc_id}</p>
                  <p className="text-xs text-slate-500">{user.role}</p>
                </div>
                <button
                  onClick={logout}
                  className="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 transition"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl flex-col md:flex-row">
        <aside className="w-full border-b border-slate-200 bg-white md:min-h-[calc(100vh-73px)] md:w-60 md:border-b-0 md:border-r">
          <nav className="flex gap-1 overflow-x-auto p-3 md:flex-col md:p-4">
            {navigation.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) =>
                  [
                    "flex min-w-fit items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                    isActive
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                  ].join(" ")
                }
              >
                <span className="w-5 text-center text-base">
                  {item.icon}
                </span>

                {item.name}
              </NavLink>
            ))}
          </nav>

          <div className="mx-4 mt-3 hidden rounded-xl bg-slate-50 p-4 md:block">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Track 3
            </p>

            <p className="mt-1 text-sm font-semibold text-slate-800">
              Predict before stock-out
            </p>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              Monitor PHCs, identify medicine shortages and recommend
              redistribution between facilities.
            </p>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}