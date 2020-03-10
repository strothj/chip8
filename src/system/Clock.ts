type Subscriber = {
  next: () => void;
  error: (error: Error) => void;
};

export type ClockSubscription = {
  unsubscribe: () => void;
};

export class Clock {
  private subscribers: Subscriber[] = [];
  private expected: number = 0;

  constructor(private readonly interval: number) {}

  private start() {
    this.expected = Date.now() + this.interval;
    setTimeout(this.step.bind(this), this.interval);
  }

  private step() {
    const drift = Date.now() - this.expected;

    // There's been a significant delay between steps. Reset the timestamp
    // instead of attempting to catch up.
    if (drift > this.interval) {
      this.expected += drift;
    }

    if (this.subscribers.length === 0) {
      return;
    }

    let error: Error | null = null;
    for (const subscriber of this.subscribers) {
      try {
        subscriber.next();
      } catch (e) {
        error = e;
        break;
      }
    }
    if (error) {
      for (const subscriber of this.subscribers) {
        subscriber.error(error);
      }
      this.subscribers = [];
      return;
    }

    this.expected += this.interval;
    setTimeout(this.step.bind(this), Math.max(0, this.interval - drift));
  }

  subscribe(subscriber: Subscriber): ClockSubscription {
    this.subscribers.push(subscriber);
    const subscription: ClockSubscription = {
      unsubscribe: () => {
        this.subscribers = this.subscribers.filter((s) => s !== subscriber);
      },
    };
    if (this.subscribers.length === 1) {
      this.start();
    }
    return subscription;
  }
}
