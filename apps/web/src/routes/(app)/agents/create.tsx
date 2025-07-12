import { createFileRoute } from "@tanstack/solid-router";
import { createSignal, Show, For } from "solid-js";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { TextField, TextFieldRoot } from "@/components/ui/textfield";
import { Checkbox, CheckboxControl } from "@/components/ui/checkbox";
import { createRecord } from "@/hooks/useMutations";
import ChevronDown from "lucide-solid/icons/chevron-down";
import Loader2 from "lucide-solid/icons/loader-2";

export const Route = createFileRoute("/(app)/agents/create")({
  component: RouteComponent,
});

// Mock roles data - replace with actual API calls
const mockRoles = [
  // Lead Management roles
  {
    id: "1",
    name: "Lead Management-Super Access",
    parent_role: "Lead Management",
  },
  { id: "2", name: "Lead Management-View", parent_role: "Lead Management" },
  { id: "3", name: "Lead Management-Edit", parent_role: "Lead Management" },
  { id: "4", name: "Lead Management-Delete", parent_role: "Lead Management" },

  // Live Chat roles
  { id: "5", name: "Live Chat-Super Access", parent_role: "Live Chat" },
  { id: "6", name: "Live Chat-View", parent_role: "Live Chat" },
  { id: "7", name: "Live Chat-Respond", parent_role: "Live Chat" },

  // Templates roles
  { id: "8", name: "Templates-Super Access", parent_role: "Templates" },
  { id: "9", name: "Templates-View", parent_role: "Templates" },
  { id: "10", name: "Templates-Create", parent_role: "Templates" },
  { id: "11", name: "Templates-Edit", parent_role: "Templates" },

  // Campaigns roles
  { id: "12", name: "Campaigns-Super Access", parent_role: "Campaigns" },
  { id: "13", name: "Campaigns-View", parent_role: "Campaigns" },
  { id: "14", name: "Campaigns-Create", parent_role: "Campaigns" },
  { id: "15", name: "Campaigns-Edit", parent_role: "Campaigns" },
];

interface FormData {
  userName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

interface SelectedOptions {
  "lead-management": string[];
  "live-chat": string[];
  templates: string[];
  campaigns: string[];
  rate_reviews: string[];
  flows: string[];
  dashboard: string[];
  reports: string[];
}

type RoleType = keyof SelectedOptions;
type ViewAll = RoleType;

function RouteComponent() {
  const [page, setPage] = createSignal(1);
  const [alertOpen, setAlertOpen] = createSignal(false);

  // Set up agent creation mutation
  const agentCreation = createRecord("users", {
    skipAccountCheck: true,
    onSuccess: (data) => {
      console.log("Agent created successfully:", data);
      setAlertOpen(true);
    },
    onError: (error) => {
      console.error("Error creating agent:", error.message);
      // You could add a toast notification here
    },
  });

  const [formData, setFormData] = createSignal<FormData>({
    userName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [selectedOptions, setSelectedOptions] = createSignal<SelectedOptions>({
    "lead-management": [],
    "live-chat": [],
    templates: [],
    campaigns: [],
    rate_reviews: [],
    flows: [],
    dashboard: [],
    reports: [],
  });

  const [viewAllArray, setViewAllArray] = createSignal<ViewAll[]>([]);

  // Filter roles by parent role
  const leadManagementRoles = () =>
    mockRoles.filter((role) => role.parent_role === "Lead Management");
  const liveChatRoles = () =>
    mockRoles.filter((role) => role.parent_role === "Live Chat");
  const templateRoles = () =>
    mockRoles.filter((role) => role.parent_role === "Templates");
  const campaignRoles = () =>
    mockRoles.filter((role) => role.parent_role === "Campaigns");

  // Get super access IDs
  const leadManagementSuperAccessId = () =>
    mockRoles.find((role) => role.name === "Lead Management-Super Access")?.id;
  const liveChatSuperAccessId = () =>
    mockRoles.find((role) => role.name === "Live Chat-Super Access")?.id;
  const templateSuperAccessId = () =>
    mockRoles.find((role) => role.name === "Templates-Super Access")?.id;
  const campaignsSuperAccessId = () =>
    mockRoles.find((role) => role.name === "Campaigns-Super Access")?.id;

  const handleInputChange = (name: keyof FormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (
    role: RoleType,
    value: string,
    checked: boolean
  ) => {
    setSelectedOptions((prev) => {
      const newOptions = { ...prev };
      if (checked) {
        newOptions[role] = [...newOptions[role], value];
      } else {
        newOptions[role] = newOptions[role].filter((item) => item !== value);
      }
      return newOptions;
    });
  };

  const handleSuperAccessChange = (
    role: RoleType,
    checked: boolean,
    roleOptions: any[]
  ) => {
    setSelectedOptions((prev) => {
      const newOptions = { ...prev };
      if (checked) {
        newOptions[role] = roleOptions.map((option) => option.value);
      } else {
        newOptions[role] = [];
      }
      return newOptions;
    });
  };

  const handleViewAllChange = (role: ViewAll, checked: boolean) => {
    setViewAllArray((prev) => {
      if (checked) {
        return [...prev, role];
      } else {
        return prev.filter((item) => item !== role);
      }
    });
  };

  const handleAgentCreation = async () => {
    try {
      // Prepare the agent data for creation
      agentCreation.create({
        name: formData().userName,
        email: formData().email,
        phonenumber: formData().phone || "", // Optional field
        // Store role assignments as JSON
        roles: JSON.stringify(selectedOptions()),
        view_all: JSON.stringify(selectedOptions()),
        // You might want to hash the password on the backend
      });
    } catch (error) {
      console.error("Error creating agent:", error);
    }
  };

  const handleFormSubmit = (e: Event) => {
    e.preventDefault();
    setPage(2);
  };

  return (
    <Show when={page() === 1} fallback={<RoleAssignmentPage />}>
      <BasicInfoPage />
    </Show>
  );

  function BasicInfoPage() {
    return (
      <div class="h-full bg-gray-50 w-full p-5">
        <div class="absolute right-3">
          <Button type="button" onClick={() => window.history.back()}>
            Go to agent management
          </Button>
        </div>

        <form onSubmit={handleFormSubmit}>
          <div class="flex justify-center items-center mt-20">
            <Card class="w-[40%] p-4">
              <CardTitle class="text-2xl text-center mb-6">
                Create Agent
              </CardTitle>

              <div class="flex justify-center">
                <div class="flex flex-col w-full space-y-4">
                  <div>
                    <label
                      for="userName"
                      class="text-sm text-gray-600 font-semibold mb-2 block"
                    >
                      Username
                    </label>
                    <TextFieldRoot>
                      <TextField
                        name="userName"
                        value={formData().userName}
                        placeholder="John Doe"
                        required
                        class="border border-gray-300 p-2"
                        onInput={(e) =>
                          handleInputChange(
                            "userName",
                            (e.target as HTMLInputElement).value
                          )
                        }
                      />
                    </TextFieldRoot>
                  </div>

                  <div>
                    <label
                      for="email"
                      class="text-sm text-gray-600 font-semibold mb-2 block"
                    >
                      Email
                    </label>
                    <TextFieldRoot>
                      <TextField
                        type="email"
                        name="email"
                        value={formData().email}
                        placeholder="example@example.com"
                        required
                        class="border border-gray-300 p-2"
                        onInput={(e) =>
                          handleInputChange(
                            "email",
                            (e.target as HTMLInputElement).value
                          )
                        }
                      />
                    </TextFieldRoot>
                  </div>

                  <div>
                    <label
                      for="phone"
                      class="text-sm text-gray-600 font-semibold mb-2 block"
                    >
                      Phone (Optional)
                    </label>
                    <TextFieldRoot>
                      <TextField
                        type="tel"
                        name="phone"
                        value={formData().phone}
                        placeholder="+1 (555) 123-4567"
                        class="border border-gray-300 p-2"
                        onInput={(e) =>
                          handleInputChange(
                            "phone",
                            (e.target as HTMLInputElement).value
                          )
                        }
                      />
                    </TextFieldRoot>
                  </div>
                </div>
              </div>

              <div class="flex justify-center mt-8">
                <Button
                  type="submit"
                  disabled={
                    formData().userName === "" || formData().email === ""
                  }
                >
                  Next
                </Button>
              </div>
            </Card>
          </div>
        </form>
      </div>
    );
  }

  function RoleAssignmentPage() {
    return (
      <div class="p-5 bg-gray-100 h-full overflow-y-scroll">
        {/* Success Dialog */}
        <Show when={alertOpen()}>
          <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 class="text-lg font-medium text-gray-900 mb-4">
                Agent created!!
              </h3>
              <p class="text-gray-600 mb-6">
                The agent has been created successfully
              </p>
              <div class="flex justify-end">
                <Button
                  onClick={() => {
                    setAlertOpen(false);
                    window.history.back();
                  }}
                >
                  OK
                </Button>
              </div>
            </div>
          </div>
        </Show>

        {/* Error Display */}
        <Show when={agentCreation.error}>
          <div class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h4 class="text-red-800 font-medium">Error Creating Agent</h4>
            <p class="text-red-600 text-sm mt-1">
              {agentCreation.error?.message}
            </p>
          </div>
        </Show>

        <div class="text-2xl font-semibold px-2 mb-6">
          Assign Roles to Agent
        </div>

        <div class="flex flex-row">
          {/* Left Column */}
          <div class="flex flex-col gap-2 w-1/2 py-2">
            {/* Lead Management Section */}
            <RoleSection
              title="Lead Management"
              roles={leadManagementRoles()}
              roleKey="lead-management"
              superAccessId={leadManagementSuperAccessId()}
              selectedOptions={selectedOptions()}
              onCheckboxChange={handleCheckboxChange}
              onSuperAccessChange={handleSuperAccessChange}
              onViewAllChange={handleViewAllChange}
            />

            {/* Live Chat Section */}
            <RoleSection
              title="Live Chat"
              roles={liveChatRoles()}
              roleKey="live-chat"
              superAccessId={liveChatSuperAccessId()}
              selectedOptions={selectedOptions()}
              onCheckboxChange={handleCheckboxChange}
              onSuperAccessChange={handleSuperAccessChange}
              onViewAllChange={handleViewAllChange}
            />
          </div>

          {/* Right Column */}
          <div class="flex flex-col w-1/2 p-2 gap-2">
            {/* Templates Section */}
            <RoleSection
              title="Templates"
              roles={templateRoles()}
              roleKey="templates"
              superAccessId={templateSuperAccessId()}
              selectedOptions={selectedOptions()}
              onCheckboxChange={handleCheckboxChange}
              onSuperAccessChange={handleSuperAccessChange}
              onViewAllChange={handleViewAllChange}
            />

            {/* Campaigns Section */}
            <RoleSection
              title="Campaigns"
              roles={campaignRoles()}
              roleKey="campaigns"
              superAccessId={campaignsSuperAccessId()}
              selectedOptions={selectedOptions()}
              onCheckboxChange={handleCheckboxChange}
              onSuperAccessChange={handleSuperAccessChange}
              onViewAllChange={handleViewAllChange}
            />
          </div>
        </div>

        <div class="flex justify-center mt-4 gap-2">
          <Button onClick={() => setPage(1)}>Go Back</Button>
          <Show
            when={!agentCreation.isPending}
            fallback={
              <Button disabled variant="secondary">
                <Loader2 size={16} class="mr-2 animate-spin" />
                Creating
              </Button>
            }
          >
            <Button onClick={handleAgentCreation} variant="secondary">
              Create Agent
            </Button>
          </Show>
        </div>
      </div>
    );
  }
}

// Role Section Component
function RoleSection(props: {
  title: string;
  roles: any[];
  roleKey: RoleType;
  superAccessId?: string;
  selectedOptions: SelectedOptions;
  onCheckboxChange: (role: RoleType, value: string, checked: boolean) => void;
  onSuperAccessChange: (
    role: RoleType,
    checked: boolean,
    roleOptions: any[]
  ) => void;
  onViewAllChange: (role: ViewAll, checked: boolean) => void;
}) {
  const [isOpen, setIsOpen] = createSignal(true);

  return (
    <div class="bg-white border border-gray-300 mb-2">
      <button
        class="flex items-center w-full p-2 bg-gray-200 hover:bg-gray-300"
        onClick={() => setIsOpen(!isOpen())}
      >
        <div class="space-x-2 flex-1 flex items-center">
          <div class="font-bold">{props.title}</div>
        </div>
        <div
          class={`transform transition-transform ${isOpen() ? "rotate-180" : ""}`}
        >
          <ChevronDown size={16} />
        </div>
      </button>

      <Show when={isOpen()}>
        <div class="py-5 px-2 text-sm text-gray-600 bg-white">
          <div class="flex flex-col space-y-5">
            {/* Super Access */}
            <Show when={props.superAccessId}>
              <div class="flex items-center group">
                <label
                  for={`${props.roleKey}_super_access`}
                  class="group-hover:cursor-pointer w-40 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Super Access
                </label>
                <Checkbox
                  checked={props.selectedOptions[props.roleKey].includes(
                    props.superAccessId!
                  )}
                  onChange={(checked) =>
                    props.onSuperAccessChange(
                      props.roleKey,
                      checked,
                      props.roles.map((role) => ({ value: role.id }))
                    )
                  }
                >
                  <CheckboxControl />
                </Checkbox>
              </div>
            </Show>

            {/* Individual Roles */}
            <For each={props.roles}>
              {(role) => (
                <Show when={!role.name.includes("Super Access")}>
                  <div class="flex items-center group">
                    <label
                      for={`${props.roleKey}_${role.id}`}
                      class="group-hover:cursor-pointer w-40 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {role.name.split("-")[1]}
                    </label>
                    <Checkbox
                      checked={props.selectedOptions[props.roleKey].includes(
                        role.id
                      )}
                      onChange={(checked) =>
                        props.onCheckboxChange(props.roleKey, role.id, checked)
                      }
                    >
                      <CheckboxControl />
                    </Checkbox>
                  </div>
                </Show>
              )}
            </For>

            {/* View All */}
            <div class="flex items-center group">
              <label
                for={`${props.roleKey}_view_all`}
                class="group-hover:cursor-pointer w-40 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                View All
              </label>
              <Checkbox
                onChange={(checked) =>
                  props.onViewAllChange(props.roleKey, checked)
                }
              >
                <CheckboxControl />
              </Checkbox>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
}
