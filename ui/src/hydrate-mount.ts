import { hydrate as runHydrate } from "./hydrate";

const hydrateModule = {
  hydrate() {
    void runHydrate();
  },
};

export default function createHydrateModule() {
  return hydrateModule;
}