export const InnerDot = ({ itemClasses2 }: { itemClasses2: string }) => {
  return (
    <Layer1>
      <Layer2>
        <Layer3>
        <div className={`h-2 w-2 rounded-full ${itemClasses2}`}/>
        </Layer3>
      </Layer2>
    </Layer1>
  );
};

const Layer1 = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
const Layer2 = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
const Layer3 = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
