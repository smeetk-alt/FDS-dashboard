/*
 * Experiment 4: Static Circular Queue (counter method)
 * HeatSense use case: a "dispatch queue" of heatwave alerts waiting to be
 * sent to field response teams. FIFO order via a fixed-size circular array.
 */
#include <stdio.h>

#define SIZE 5

int queue[SIZE];
int front = 0, rear = 0, count = 0;

void createQueue(void) {
    front = rear = count = 0;
}

int isEmpty(void) {
    return count == 0;
}

int isFull(void) {
    return count == SIZE;
}

int size(void) {
    return count;
}

void enqueue(int val) {
    if (isFull()) {
        printf("Queue full. Cannot dispatch alert %d.\n", val);
        return;
    }
    queue[rear] = val;
    rear = (rear + 1) % SIZE;
    count++;
}

int dequeue(void) {
    if (isEmpty()) {
        printf("Queue empty.\n");
        return -1;
    }
    int val = queue[front];
    front = (front + 1) % SIZE;
    count--;
    return val;
}

int getFront(void) {
    if (isEmpty()) return -1;
    return queue[front];
}

int getRear(void) {
    if (isEmpty()) return -1;
    return queue[(rear - 1 + SIZE) % SIZE];
}

void displayAll(void) {
    int i, idx;
    printf("Queue (front -> rear): ");
    for (i = 0; i < count; i++) {
        idx = (front + i) % SIZE;
        printf("%d ", queue[idx]);
    }
    printf("\n");
}

int main(void) {
    int choice, val;

    createQueue();

    while (1) {
        printf("\n1. Enqueue  2. Dequeue  3. Front/Rear  4. Display  5. Exit\nChoice: ");
        if (scanf("%d", &choice) != 1) break;

        switch (choice) {
            case 1:
                printf("Alert ID to dispatch: "); scanf("%d", &val);
                enqueue(val);
                break;
            case 2:
                val = dequeue();
                if (val != -1) printf("Dispatched alert %d.\n", val);
                break;
            case 3:
                printf("Front: %d, Rear: %d, Count: %d\n", getFront(), getRear(), size());
                break;
            case 4:
                displayAll();
                break;
            case 5:
                return 0;
            default:
                printf("Invalid choice.\n");
        }
    }
    return 0;
}
