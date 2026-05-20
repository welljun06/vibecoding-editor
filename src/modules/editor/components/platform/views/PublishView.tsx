import type { Artifact } from '../../../store/artifact-store'
import PublishCenter from '../PublishCenter'

interface Props {
  artifact: Artifact
}

/** Layer 3 content for the '发布' view tab. PublishCenter already filters
 *  by project — for v1 we surface the project-wide publish center inside
 *  the artifact view; future iteration will further filter to only jobs
 *  including this artifact. */
export default function PublishView({ artifact }: Props) {
  return <PublishCenter projectId={artifact.projectId} />
}
