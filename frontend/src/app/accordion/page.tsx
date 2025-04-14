import AccordionGroup from '../../components/AccordionGroup';
import AccordionWithAvatar from '../../components/AccordionWithAvatar';

export default function AccordionPage() {
  return (
    <div>
      <h1 className="text-xl font-medium mb-4">Default Accordion</h1>
      <AccordionGroup />

      <h1 className="text-xl font-medium mb-4 mt-6">Accordion With Avatar</h1>
      <AccordionWithAvatar />
    </div>
  );
}
