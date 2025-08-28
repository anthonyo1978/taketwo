import type { Meta, StoryObj } from "@storybook/react"
import { LoginForm } from "./LoginForm"

const meta: Meta<typeof LoginForm> = {
  title: "Components/LoginForm",
  component: LoginForm,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: "The default login form with email and password fields. Uses mock API for authentication.",
      },
    },
  },
}

export const WithCustomCallback: Story = {
  args: {
    onSuccess: () => {
      alert("Login successful! Custom callback executed.")
    },
  },
  parameters: {
    docs: {
      description: {
        story: "Login form with custom success callback instead of default redirect.",
      },
    },
  },
}

export const WithCustomClass: Story = {
  args: {
    className: "bg-gray-50 p-4 rounded-lg border",
  },
  parameters: {
    docs: {
      description: {
        story: "Login form with custom styling applied via className prop.",
      },
    },
  },
}

// Story showing the form with pre-filled valid credentials for testing
export const WithValidCredentials: Story = {
  args: {},
  decorators: [
    (Story) => (
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <div className="mb-4 rounded border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
          <strong>Test Credentials:</strong>
          <br />
          Email: test@example.com
          <br />
          Password: password123
        </div>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          "Login form with test credentials displayed for easy testing. Use the provided credentials to test successful login.",
      },
    },
  },
}
