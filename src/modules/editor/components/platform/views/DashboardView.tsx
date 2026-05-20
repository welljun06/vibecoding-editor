import type { Artifact } from '../../../store/artifact-store'
import DashboardModule from '../DashboardModule'

interface Props {
  artifact: Artifact
}

/** Layer 3 content for the '运行看板' view tab. Re-uses the project-level
 *  DashboardModule but seeds the snapshot by `${projectId}|${artifactId}`
 *  so each artifact gets its own distinct chart shape — gives the demo
 *  some apparent per-artifact differentiation without standing up real
 *  per-artifact telemetry. */
export default function DashboardView({ artifact }: Props) {
  return <DashboardModule projectId={`${artifact.projectId}|${artifact.id}`} />
}
