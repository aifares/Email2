export default function AccordionWithAvatar() {
  return (
    <div>
      
      <div className="accordion accordion-shadow max-w-lg">
        <div className="accordion-item active" id="payment-arrow-right">
          <button
            className="accordion-toggle inline-flex items-center justify-between text-start"
            aria-controls="payment-arrow-right-collapse"
            aria-expanded="true"
          >
            <div className="flex gap-4">
              <div className="avatar">
                <div className="size-12 rounded-md">
                  <img
                    src="https://cdn.flyonui.com/fy-assets/avatar/avatar-2.png"
                    alt="avatar"
                  />
                </div>
              </div>
              <div>
                <p className="mb-0.5">Richard Payne</p>
                <p className="text-sm text-base-content/50 font-normal">
                  pwright@yahoo.com
                </p>
              </div>
            </div>
            <span className="icon-[tabler--chevron-left] accordion-item-active:-rotate-90 size-5 shrink-0 transition-transform duration-300 rtl:-rotate-180"></span>
          </button>
          <div
            id="payment-arrow-right-collapse"
            className="accordion-content w-full overflow-hidden transition-[height] duration-300"
            aria-labelledby="payment-arrow-right"
            role="region"
          >
            <div className="px-5 pb-4">
              <p className="text-base-content/80 font-normal">
                Richard Payne is a remarkable individual known for his
                exceptional skills and expertise in various fields. With a
                strong background in technology and a passion for innovation,
                Richard has made significant contributions to the industry.
              </p>
            </div>
          </div>
        </div>

        <div className="accordion-item" id="delivery-arrow-right">
          <button
            className="accordion-toggle inline-flex items-center justify-between text-start"
            aria-controls="delivery-arrow-right-collapse"
            aria-expanded="false"
          >
            <div className="flex gap-4">
              <div className="avatar">
                <div className="size-12 rounded-md">
                  <img
                    src="https://cdn.flyonui.com/fy-assets/avatar/avatar-7.png"
                    alt="avatar"
                  />
                </div>
              </div>
              <div>
                <p className="mb-0.5">Jordan Stevenson</p>
                <p className="text-sm text-base-content/50 font-normal">
                  wramirez@outlook.com
                </p>
              </div>
            </div>
            <span className="icon-[tabler--chevron-left] accordion-item-active:-rotate-90 size-5 shrink-0 transition-transform duration-300 rtl:-rotate-180"></span>
          </button>
          <div
            id="delivery-arrow-right-collapse"
            className="accordion-content hidden w-full overflow-hidden transition-[height] duration-300"
            aria-labelledby="delivery-arrow-right"
            role="region"
          >
            <div className="px-5 pb-4">
              <p className="text-base-content/80 font-normal">
                Jordan Stevenson is a talented individual with a passion for
                technology and innovation. Jordan has made significant
                contributions to various projects and has a deep understanding
                of programming languages and frameworks.
              </p>
            </div>
          </div>
        </div>

        <div className="accordion-item" id="cancel-arrow-right">
          <button
            className="accordion-toggle inline-flex items-center justify-between text-start"
            aria-controls="cancel-arrow-right-collapse"
            aria-expanded="false"
          >
            <div className="flex gap-4">
              <div className="avatar">
                <div className="size-12 rounded-md">
                  <img
                    src="https://cdn.flyonui.com/fy-assets/avatar/avatar-8.png"
                    alt="avatar"
                  />
                </div>
              </div>
              <div>
                <p className="mb-0.5">Nicholas Tanner</p>
                <p className="text-sm text-base-content/50 font-normal">
                  snguyen@icloud.com
                </p>
              </div>
            </div>
            <span className="icon-[tabler--chevron-left] accordion-item-active:-rotate-90 size-5 shrink-0 transition-transform duration-300 rtl:-rotate-180"></span>
          </button>
          <div
            id="cancel-arrow-right-collapse"
            className="accordion-content hidden w-full overflow-hidden transition-[height] duration-300"
            aria-labelledby="cancel-arrow-right"
            role="region"
          >
            <div className="px-5 pb-4">
              <p className="text-base-content/80 font-normal">
                Nicholas Tanner is a highly skilled individual with a strong
                passion for technology and innovation. Nicholas has made
                significant contributions to numerous projects and possesses a
                deep understanding of various programming languages and
                frameworks.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
