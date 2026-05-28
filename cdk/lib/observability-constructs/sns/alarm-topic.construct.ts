import * as sns from 'aws-cdk-lib/aws-sns';
import * as sns_subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';

interface AlarmTopicProps {
  topicName: string;
  alarmEmail?: string;
}

export class AlarmTopicConstruct extends Construct {
  readonly topic: sns.Topic;

  constructor(scope: Construct, id: string, props: AlarmTopicProps) {
    super(scope, id);

    this.topic = new sns.Topic(this, 'Topic', {
      displayName: props.topicName,
    });

    if (props.alarmEmail) {
      this.topic.addSubscription(new sns_subscriptions.EmailSubscription(props.alarmEmail));
    }
  }
}
