export const InnerDot = () => {
  return (
    <Layer1>
      <Layer2>
        <Layer3>
        <div className="theme-test-dark:bg-red-400 theme-test-light:bg-blue-400 flex h-2 w-2 items-center justify-center rounded-sm"/>
        </Layer3>
      </Layer2>
    </Layer1>
  );
};

const Layer1 = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
const Layer2 = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
const Layer3 = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;