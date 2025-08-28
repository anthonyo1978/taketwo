import type { Meta, StoryObj } from "@storybook/react"
import { Input } from "./Input"

const meta: Meta<typeof Input> = {
  title: "UI/Input",
  component: Input,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: { type: "select" },
      options: ["default", "error"],
    },
    type: {
      control: { type: "select" },
      options: ["text", "email", "password", "number"],
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    id: "default-input",
    label: "Username",
    placeholder: "Enter your username",
  },
}

export const WithError: Story = {
  args: {
    id: "error-input",
    label: "Email",
    placeholder: "Enter your email",
    error: "Please enter a valid email address",
  },
}

export const Required: Story = {
  args: {
    id: "required-input",
    label: "Password",
    type: "password",
    placeholder: "Enter your password",
    required: true,
  },
}

export const EmailType: Story = {
  args: {
    id: "email-input",
    label: "Email Address",
    type: "email",
    placeholder: "you@example.com",
    autoComplete: "username",
  },
}

export const PasswordType: Story = {
  args: {
    id: "password-input",
    label: "Password",
    type: "password",
    placeholder: "Enter your password",
    autoComplete: "current-password",
  },
}

export const Disabled: Story = {
  args: {
    id: "disabled-input",
    label: "Disabled Field",
    placeholder: "This field is disabled",
    disabled: true,
    value: "Cannot be edited",
  },
}

export const WithoutLabel: Story = {
  args: {
    id: "no-label-input",
    placeholder: "Input without label",
    "aria-label": "Search",
  },
}
