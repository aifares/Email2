import classNames from 'classnames';

export default function Button(props: any) {
  const { classnames, content } = props;

  return <button className={classNames('btn', classnames)}>{content}</button>;
}
