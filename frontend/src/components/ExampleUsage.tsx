import React from "react";
import { Button, Card, Input } from "./ui";

// Example component showing how to use the design system
const ExampleUsage: React.FC = () => {
  return (
    <Card padding="xl" shadow="md">
      <h3>Design System Example</h3>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          marginTop: "1rem",
        }}
      >
        {/* Buttons */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
        </div>

        {/* Different sizes */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </div>

        {/* Input examples */}
        <Input label="Example Input" placeholder="Type something..." />
        <Input label="With Error" error="This field is required" />
        <Input label="Disabled" disabled value="Disabled input" />
      </div>
    </Card>
  );
};

export default ExampleUsage;
