export const InnerDot = ({ itemClasses2 }: { itemClasses2: string }) => {
  return (
    <Layer1>
      <Layer2>
        <Layer3>
        <div className={`rounded-full h-[2px] w-[2px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${itemClasses2}`}/>
        </Layer3>
      </Layer2>
    </Layer1>
  );
};

const Layer1 = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
const Layer2 = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
const Layer3 = ({ children }: { children: React.ReactNode }) => <div className='relative'>{children}</div>;
