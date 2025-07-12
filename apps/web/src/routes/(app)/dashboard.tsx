import { createFileRoute } from "@tanstack/solid-router";
import { createSignal, Show } from "solid-js";

export const Route = createFileRoute("/(app)/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const [loading, setLoading] = createSignal(false);

  return (
    <div class="p-6 bg-gray-100 min-h-full">
      <div class="max-w-7xl mx-auto">
        <header class="mb-6">
          <h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p class="text-gray-600">Welcome to your dashboard</p>
        </header>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Account Overview Card */}
          <div class="bg-white p-6 rounded-lg shadow">
            <h2 class="text-xl font-semibold mb-4">Account Overview</h2>
            <div class="space-y-2">
              <div class="flex justify-between">
                <span class="text-gray-600">Status:</span>
                <span class="font-medium text-green-600">Active</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Platform:</span>
                <span class="font-medium">WhatsApp Business</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Phone:</span>
                <span class="font-medium">+1234567890</span>
              </div>
            </div>
          </div>

          {/* Recent Activity Card */}
          <div class="bg-white p-6 rounded-lg shadow">
            <h2 class="text-xl font-semibold mb-4">Recent Activity</h2>
            <div class="space-y-4">
              <div class="border-b pb-2">
                <p class="font-medium">Campaign Created</p>
                <p class="text-sm text-gray-600">Summer Promotion</p>
                <p class="text-xs text-gray-500">2 hours ago</p>
              </div>
              <div class="border-b pb-2">
                <p class="font-medium">Message Sent</p>
                <p class="text-sm text-gray-600">To 150 recipients</p>
                <p class="text-xs text-gray-500">Yesterday</p>
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div class="bg-white p-6 rounded-lg shadow">
            <h2 class="text-xl font-semibold mb-4">Quick Actions</h2>
            <div class="space-y-3">
              <button class="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition">
                New Campaign
              </button>
              <button class="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 transition">
                View Messages
              </button>
              <button class="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 transition">
                Manage Templates
              </button>
            </div>
          </div>
        </div>

        {/* Recent Campaigns Section */}
        <div class="mt-8 bg-white p-6 rounded-lg shadow">
          <h2 class="text-xl font-semibold mb-4">Recent Campaigns</h2>
          <Show
            when={!loading()}
            fallback={<div class="text-center py-4">Loading campaigns...</div>}
          >
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sent
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Delivered
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Read
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr>
                    <td class="px-6 py-4 whitespace-nowrap">Summer Sale</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Completed
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">250</td>
                    <td class="px-6 py-4 whitespace-nowrap">245</td>
                    <td class="px-6 py-4 whitespace-nowrap">200</td>
                  </tr>
                  <tr>
                    <td class="px-6 py-4 whitespace-nowrap">
                      New Product Launch
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        In Progress
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">150</td>
                    <td class="px-6 py-4 whitespace-nowrap">148</td>
                    <td class="px-6 py-4 whitespace-nowrap">120</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Show>
        </div>
      </div>
    </div>
  );
}
