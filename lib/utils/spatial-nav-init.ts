// Spatial navigation must be initialized before any useFocusable hook runs.
// This file is imported at the top of providers.tsx (client boundary)
// so it executes synchronously on the client before children mount.

import { init, GetBoundingClientRectAdapter } from "@noriginmedia/norigin-spatial-navigation";

if (typeof window !== "undefined") {
  init({ debug: false, visualDebug: false, layoutAdapter: GetBoundingClientRectAdapter });
}
