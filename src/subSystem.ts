type StopFunction = () => Promise<void>;

type SubSystem = {
  dependencies: string[];
  init: () => Promise<StopFunction>;
};
