import { ReactNode, createContext, useContext } from "react";

export class ResembleClient {
  endpoint: string;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }
}

interface IResembleContext {
  client: ResembleClient | undefined;
}

const defaultValue: IResembleContext = { client: undefined };

const ResembleContext = createContext(defaultValue);

export const ResembleClientProvider = ({
  children,
  client,
}: {
  children: ReactNode;
  client: ResembleClient;
}) => {
  return (
    <ResembleContext.Provider value={{ client }}>
      {children}
    </ResembleContext.Provider>
  );
};

export const useResembleContext = () => {
  const context = useContext(ResembleContext);
  if (context == undefined) {
    throw new Error(
      "useResembleContext must be used within a GrpcContextProvider."
    );
  }

  return context;
};
