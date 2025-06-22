import { FiCalendar, FiTrendingUp, FiUsers, FiClock } from "react-icons/fi";

const ReservationsPage = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Reservations</h1>
        <div className="flex gap-2">
          <select className="px-3 py-1.5 rounded bg-content2 text-sm">
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      {/* Reservation Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-content1 shadow-small space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-default-500">Active Reservations</span>
            <FiCalendar className="text-primary" />
          </div>
          <p className="text-2xl font-bold">156</p>
          <p className="text-xs text-success flex items-center gap-1">
            <FiTrendingUp />
            15% more than yesterday
          </p>
        </div>

        <div className="p-4 rounded-lg bg-content1 shadow-small space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-default-500">Total Passengers</span>
            <FiUsers className="text-primary" />
          </div>
          <p className="text-2xl font-bold">432</p>
          <p className="text-xs text-success flex items-center gap-1">
            <FiTrendingUp />
            8% more than yesterday
          </p>
        </div>

        <div className="p-4 rounded-lg bg-content1 shadow-small space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-default-500">Average Wait Time</span>
            <FiClock className="text-primary" />
          </div>
          <p className="text-2xl font-bold">12m</p>
          <p className="text-xs text-success flex items-center gap-1">
            <FiTrendingUp />
            20% faster than average
          </p>
        </div>

        <div className="p-4 rounded-lg bg-content1 shadow-small space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-default-500">Upcoming Reservations</span>
            <FiCalendar className="text-primary" />
          </div>
          <p className="text-2xl font-bold">89</p>
          <p className="text-xs text-success flex items-center gap-1">
            <FiTrendingUp />
            10% more than usual
          </p>
        </div>
      </div>

      {/* Reservations List */}
      <div className="rounded-lg bg-content1 shadow-small p-4">
        <h2 className="text-lg font-semibold mb-4">Recent Reservations</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-default-500 border-b border-divider">
                <th className="pb-3 px-4">Reservation ID</th>
                <th className="pb-3 px-4">Customer</th>
                <th className="pb-3 px-4">Date</th>
                <th className="pb-3 px-4">Status</th>
                <th className="pb-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-divider">
                <td className="py-3 px-4">#RES-001</td>
                <td className="py-3 px-4">John Doe</td>
                <td className="py-3 px-4">Today, 2:30 PM</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 text-xs rounded-full bg-success/10 text-success">
                    Confirmed
                  </span>
                </td>
                <td className="py-3 px-4">
                  <button className="text-primary hover:underline">
                    View Details
                  </button>
                </td>
              </tr>
              <tr className="border-b border-divider">
                <td className="py-3 px-4">#RES-002</td>
                <td className="py-3 px-4">Jane Smith</td>
                <td className="py-3 px-4">Today, 3:00 PM</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 text-xs rounded-full bg-warning/10 text-warning">
                    Pending
                  </span>
                </td>
                <td className="py-3 px-4">
                  <button className="text-primary hover:underline">
                    View Details
                  </button>
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4">#RES-003</td>
                <td className="py-3 px-4">Mike Johnson</td>
                <td className="py-3 px-4">Today, 4:15 PM</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 text-xs rounded-full bg-success/10 text-success">
                    Confirmed
                  </span>
                </td>
                <td className="py-3 px-4">
                  <button className="text-primary hover:underline">
                    View Details
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReservationsPage;
