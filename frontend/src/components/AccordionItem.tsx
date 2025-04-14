import classNames from 'classnames';

export default function AccordionItem(props: any) {
  const { isActive, title, content } = props;
  return (
    <div className={classNames('accordion-item', isActive ? 'active' : '')}>
      <button className="accordion-toggle inline-flex items-center gap-x-4 text-start">
        <span className="icon-[tabler--plus] accordion-item-active:hidden text-base-content size-4.5 block shrink-0"></span>
        <span className="icon-[tabler--minus] accordion-item-active:block text-base-content size-4.5 hidden shrink-0"></span>
        {title}
      </button>
      <div
        className={classNames(
          'accordion-content w-full overflow-hidden transition-[height] duration-300',
          isActive ? '' : 'hidden'
        )}
        role="region"
      >
        <div className="px-5 pb-4">
          <p className="text-base-content/80 font-normal">{content}</p>
        </div>
      </div>
    </div>
  );
}
