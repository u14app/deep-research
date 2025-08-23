"use client";

type Props = {
  data: ImageSource[];
};

function Lightbox(props: Props) {
  const { data = [] } = props;

  return (
    <div className="flex flex-wrap gap-3 max-lg:gap-2">
      {data.map((item, idx) => {
        return (
          <picture
            key={idx}
            className="h-44 w-44 mt-0 mb-0 max-lg:h-40 max-lg:w-40 max-sm:w-36 max-sm:h-36"
          >
            <img
              className="h-full w-full rounded object-cover block"
              src={item.url}
              title={item.description}
              alt={item.description}
              referrerPolicy="no-referrer"
              rel="noopener noreferrer"
            />
          </picture>
        );
      })}
    </div>
  );
}

export default Lightbox;
