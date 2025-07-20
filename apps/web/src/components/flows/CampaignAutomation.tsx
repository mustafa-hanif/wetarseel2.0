import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { TextField, TextFieldLabel, TextFieldRoot } from "@/components/ui/textfield";
import { PlusCircle } from "lucide-solid";
import { useNavigate } from "@tanstack/solid-router";
import { createSignal, For } from "solid-js";
import { useAuth } from "@/hooks/useAuth";

export interface ITemplateDatabase {
  id: string;
  template_name: string;
  category: string;
}

interface CampaignAutomationProps {
  templates: ITemplateDatabase[];
}

export function CampaignAutomation(props: CampaignAutomationProps) {
  const [selectedTemplate, setSelectedTemplate] = createSignal<string>();
  const [automationName, setAutomationName] = createSignal('');
  const [automationDescription, setAutomationDescription] = createSignal('');

  const navigate = useNavigate();
  const auth = useAuth();

  const handleCreateAutomation = async () => {
    console.log('Creating automation:', {
      template: selectedTemplate(),
      name: automationName(),
      description: automationDescription(),
    });
    
    // TODO: Implement createAutomation API call
    // const res = await createAutomation({
    //   account: auth.data?.accountId,
    //   template: selectedTemplate(),
    //   name: automationName(),
    //   description: automationDescription(),
    // });
    
    // Reset form
    setSelectedTemplate(undefined);
    setAutomationName('');
    setAutomationDescription('');
    navigate({ to: "/flows/create-automation", search: { automation_id: 'new' } });
  };

  return (
    <div class="mx-auto py-8">
      <div class="mb-6">
        <CardTitle>Create an automation specific to your campaign</CardTitle>
        <p>
          This kind of automation will <strong>only</strong> run if a message is received against this template
        </p>
      </div>

      <div class="flex space-x-8 w-full">
        <Card class="flex-grow">
          <CardHeader>
            <CardTitle>Select a Template</CardTitle>
            <CardDescription>Choose a template for your automation campaign</CardDescription>
          </CardHeader>
          <CardContent>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <For each={props.templates.filter((t) => t.template_name !== 'blank')}>
                {(template) => (
                  <label
                    class="flex items-center space-x-3 border border-slate-200 rounded-lg p-4 cursor-pointer hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-800"
                  >
                    <input
                      type="radio"
                      name="template"
                      value={template.id}
                      checked={selectedTemplate() === template.id}
                      onChange={(e) => setSelectedTemplate((e.target as HTMLInputElement).value)}
                      class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div>
                      <p class="font-medium">{template.template_name}</p>
                      <p class="text-sm text-slate-500 dark:text-slate-400">{template.category}</p>
                    </div>
                  </label>
                )}
              </For>
            </div>
          </CardContent>
        </Card>

        <Card class="flex-grow">
          <CardHeader>
            <CardTitle>Customize Your Automation</CardTitle>
            <CardDescription>Provide details for your new automation</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <TextFieldRoot>
              <TextFieldLabel for="automation-name">Automation Name</TextFieldLabel>
              <TextField 
                id="automation-name" 
                placeholder="Enter automation name" 
                value={automationName()} 
                onInput={(e) => setAutomationName((e.target as HTMLInputElement).value)} 
              />
            </TextFieldRoot>
            <TextFieldRoot>
              <TextFieldLabel for="automation-description">Description</TextFieldLabel>
              <textarea
                id="automation-description"
                placeholder="Describe your automation"
                value={automationDescription()}
                onInput={(e) => setAutomationDescription((e.target as HTMLTextAreaElement).value)}
                class="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-md shadow-gray-100 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-[1.5px] focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </TextFieldRoot>
          </CardContent>
          <CardFooter>
            {selectedTemplate() ? (
              <Button 
                variant="secondary" 
                onClick={handleCreateAutomation} 
                disabled={!automationName()}
              >
                <PlusCircle class="mr-2 h-4 w-4" />
                Create Automation
              </Button>
            ) : (
              <Button variant="secondary" disabled>
                Select a template
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}