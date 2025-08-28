import { action } from "@storybook/addon-actions"
import type { Meta, StoryObj } from "@storybook/react"
import { HouseForm } from "./HouseForm"

const meta: Meta<typeof HouseForm> = {
  title: "Components/HouseForm",
  component: HouseForm,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New House</h2>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    onSubmit: { action: "submitted" },
    isLoading: { control: "boolean" },
    className: { control: "text" },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    onSubmit: action("form-submitted"),
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story: "The default house form with all sections: address details, property details, and additional information.",
      },
    },
  },
}

export const Loading: Story = {
  args: {
    onSubmit: action("form-submitted"),
    isLoading: true,
  },
  parameters: {
    docs: {
      description: {
        story: "House form in loading state - all fields disabled and submit button shows 'Creating...'",
      },
    },
  },
}

export const WithCustomClass: Story = {
  args: {
    onSubmit: action("form-submitted"),
    className: "bg-gray-50 p-8 rounded-xl border-2 border-blue-200",
  },
  parameters: {
    docs: {
      description: {
        story: "House form with custom styling applied via className prop.",
      },
    },
  },
}

export const WithPrefilledData: Story = {
  args: {
    onSubmit: action("form-submitted"),
  },
  decorators: [
    (Story) => {
      // Use useEffect to prefill form data after component mounts
      const prefillForm = () => {
        setTimeout(() => {
          const addressInput = document.querySelector('input[name="address1"]') as HTMLInputElement
          const unitInput = document.querySelector('input[name="unit"]') as HTMLInputElement
          const suburbInput = document.querySelector('input[name="suburb"]') as HTMLInputElement
          const stateSelect = document.querySelector('select[name="state"]') as HTMLSelectElement
          const postcodeInput = document.querySelector('input[name="postcode"]') as HTMLInputElement
          const residentInput = document.querySelector('input[name="resident"]') as HTMLInputElement
          const notesTextarea = document.querySelector('textarea[name="notes"]') as HTMLTextAreaElement

          if (addressInput) addressInput.value = "123 Example Street"
          if (unitInput) unitInput.value = "Apt 2B"
          if (suburbInput) suburbInput.value = "Sydney"
          if (stateSelect) stateSelect.value = "NSW"
          if (postcodeInput) postcodeInput.value = "2000"
          if (residentInput) residentInput.value = "John Smith"
          if (notesTextarea) notesTextarea.value = "Modern 2-bedroom apartment with city views"

          // Trigger change events
          ;[addressInput, unitInput, suburbInput, postcodeInput, residentInput, notesTextarea].forEach(input => {
            if (input) {
              const event = new Event('input', { bubbles: true })
              input.dispatchEvent(event)
            }
          })

          if (stateSelect) {
            const event = new Event('change', { bubbles: true })
            stateSelect.dispatchEvent(event)
          }
        }, 100)
      }

      return (
        <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
          <div className="mb-4 rounded border border-green-200 bg-green-50 p-3 text-sm text-green-800">
            <strong>Pre-filled Example:</strong> This story shows the form with sample data to demonstrate the complete user experience.
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New House</h2>
          <div onLoad={prefillForm}>
            <Story />
          </div>
        </div>
      )
    },
  ],
  parameters: {
    docs: {
      description: {
        story: "House form with pre-filled sample data to showcase the complete form experience.",
      },
    },
  },
}

export const ValidationDemo: Story = {
  args: {
    onSubmit: action("form-submitted"),
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="mb-4 rounded border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800">
          <strong>Validation Demo:</strong> Try submitting the form without filling required fields to see validation errors.
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New House</h2>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: "House form configured to demonstrate validation behavior. Submit without required fields to see error states.",
      },
    },
  },
}

export const CompactView: Story = {
  args: {
    onSubmit: action("form-submitted"),
    className: "max-w-2xl",
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-2xl mx-auto p-4 bg-white rounded-lg shadow">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Add New House (Compact)</h2>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: "House form in a more compact layout for smaller screens or embedded contexts.",
      },
    },
  },
}