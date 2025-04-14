import Button from '../../components/Button';

export default function ButtonPage() {
  return (
    <div>
      <h1 className="text-xl font-medium mb-4">Solid Buttons</h1>
      <div className="flex flex-wrap gap-2">
        <Button classnames="btn-primary" content="Primary" />
        <Button classnames="btn-info" content="Info" />
        <Button classnames="btn-success" content="Success" />
        <Button classnames="btn-warning" content="Warning" />
        <Button classnames="btn-error" content="Error" />
      </div>

      <h1 className="text-xl font-medium mb-4 mt-6">Soft Buttons</h1>
      <div className="flex flex-wrap gap-2">
        <Button classnames="btn-soft btn-primary" content="Primary" />
        <Button classnames="btn-soft btn-info" content="Info" />
        <Button classnames="btn-soft btn-success" content="Success" />
        <Button classnames="btn-soft btn-warning" content="Warning" />
        <Button classnames="btn-soft btn-error" content="Error" />
      </div>
      <h1 className="text-xl font-medium mb-4 mt-6">Outline Buttons</h1>
      <div className="flex flex-wrap gap-2">
        <Button classnames="btn-outline btn-primary" content="Primary" />
        <Button classnames="btn-outline btn-info" content="Info" />
        <Button classnames="btn-outline btn-success" content="Success" />
        <Button classnames="btn-outline btn-warning" content="Warning" />
        <Button classnames="btn-outline btn-error" content="Error" />
      </div>
      <h1 className="text-xl font-medium mb-4 mt-6">Text Buttons</h1>
      <div className="flex flex-wrap gap-2">
        <Button classnames="btn-text btn-primary" content="Primary" />
        <Button classnames="btn-text btn-info" content="Info" />
        <Button classnames="btn-text btn-success" content="Success" />
        <Button classnames="btn-text btn-warning" content="Warning" />
        <Button classnames="btn-text btn-error" content="Error" />
      </div>
      <h1 className="text-xl font-medium mb-4 mt-6">Gradient Buttons</h1>
      <div className="flex flex-wrap gap-2">
        <Button classnames="btn-gradient btn-primary" content="Primary" />
        <Button classnames="btn-gradient btn-info" content="Info" />
        <Button classnames="btn-gradient btn-success" content="Success" />
        <Button classnames="btn-gradient btn-warning" content="Warning" />
        <Button classnames="btn-gradient btn-error" content="Error" />
      </div>
    </div>
  );
}
