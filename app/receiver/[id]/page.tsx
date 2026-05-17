"use client";

import { useParams } from "next/navigation";

export default function ReceiverProfile() {
  const params = useParams();

  return (
    <div style={{ padding: "20px" }}>
      <h1>Receiver Profile Page</h1>

      <p>Receiver ID: {params.id}</p>
    </div>
  );
}