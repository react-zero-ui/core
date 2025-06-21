export const InnerDot = () => {
  return (
    <Layer1>
      <Layer2>
        <Layer3>
        <div className="theme-test-dark:bg-red-400 theme-test-light:bg-blue-400 rounded-full h-[2px] w-[2px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"/>
        </Layer3>
      </Layer2>
    </Layer1>
  );
};

const Layer1 = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
const Layer2 = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
const Layer3 = ({ children }: { children: React.ReactNode }) => <div className='relative'>{children}</div>;