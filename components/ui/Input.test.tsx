import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Input } from "./Input"

describe("Input", () => {
  it("renders input with label", () => {
    render(<Input id="test-input" label="Test Label" />)

    expect(screen.getByLabelText("Test Label")).toBeInTheDocument()
    expect(screen.getByRole("textbox")).toHaveAttribute("id", "test-input")
  })

  it("displays required indicator when required", () => {
    render(<Input id="required-input" label="Required Field" required />)

    expect(screen.getByText("*")).toBeInTheDocument()
    expect(screen.getByLabelText("required")).toBeInTheDocument()
  })

  it("displays error state with error message", () => {
    render(<Input id="error-input" label="Email" error="Please enter a valid email" />)

    const input = screen.getByRole("textbox")
    const errorMessage = screen.getByRole("alert")

    expect(input).toHaveAttribute("aria-invalid", "true")
    expect(input).toHaveAttribute("aria-describedby", "error-input-error")
    expect(errorMessage).toHaveTextContent("Please enter a valid email")
    expect(errorMessage).toHaveAttribute("id", "error-input-error")
  })

  it("handles user input correctly", async () => {
    const user = userEvent.setup()
    render(<Input id="user-input" label="Username" />)

    const input = screen.getByRole("textbox")
    await user.type(input, "testuser")

    expect(input).toHaveValue("testuser")
  })

  it("supports different input types", () => {
    render(<Input id="password-input" type="password" label="Password" />)

    const input = screen.getByLabelText("Password")
    expect(input).toHaveAttribute("type", "password")
  })

  it("applies custom className", () => {
    render(<Input id="custom-input" label="Custom" className="custom-class" />)

    const input = screen.getByRole("textbox")
    expect(input).toHaveClass("custom-class")
  })

  it("forwards ref correctly", () => {
    const ref = { current: null }
    render(<Input id="ref-input" ref={ref as React.RefObject<HTMLInputElement>} />)

    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })

  it("supports autoComplete attribute", () => {
    render(<Input id="email-input" type="email" label="Email" autoComplete="username" />)

    const input = screen.getByRole("textbox")
    expect(input).toHaveAttribute("autocomplete", "username")
  })
})
