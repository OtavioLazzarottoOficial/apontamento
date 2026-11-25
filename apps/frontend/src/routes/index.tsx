import { createFileRoute } from "@tanstack/react-router";
import { SequencingWorkspace } from "../components/sequencing/sequencing-workspace.tsx";

export const Route = createFileRoute("/")({ component: SequencingWorkspace });
