export default function Card() {
  return (
    <div>
      <h1 className="text-xl font-medium mb-6">Cards</h1>
      <div className="card group hover:shadow sm:max-w-sm mb-6">
        <figure>
          <img
            src="https://cdn.flyonui.com/fy-assets/components/card/image-8.png"
            alt="Shoes"
            className="transition-transform duration-500 group-hover:scale-110"
          />
        </figure>
        <div className="card-body">
          <h5 className="card-title mb-2.5">Card title</h5>
          <p className="mb-6">
            Nike Air Max is a popular line of athletic shoes that feature Nike's
            signature Air cushioning technology in the sole.
          </p>
          <div className="card-actions">
            <button className="btn btn-primary">Buy Now</button>
            <button className="btn btn-secondary btn-soft">Add to cart</button>
          </div>
        </div>
      </div>
      <div className="card image-full sm:max-w-sm">
        <figure>
          <img
            src="https://cdn.flyonui.com/fy-assets/components/card/image-5.png"
            alt="overlay image"
          />
        </figure>
        <div className="card-body">
          <h2 className="card-title mb-2.5 text-white">Marketing</h2>
          <p className="text-white">
            Boost your brand's visibility and engagement through targeted
            marketing strategies.
          </p>
        </div>
      </div>
    </div>
  );
}
