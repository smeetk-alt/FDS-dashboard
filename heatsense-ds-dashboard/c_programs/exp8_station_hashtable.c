/*
 * Experiment 8: Hash Table (Dictionary using Circular Array)
 * HeatSense use case: a dictionary mapping station_id (key) -> temperature
 * reading (data), using linear probing over a circular array for collisions.
 */
#include <stdio.h>

#define SIZE 10
#define EMPTY_KEY -1
#define DELETED_KEY -2

struct DataItem {
    int data; /* temperature reading, stored as integer tenths (e.g. 452 = 45.2C) */
    int key;  /* station_id */
};

struct DataItem hashArray[SIZE];
struct DataItem dummyItem;

int hashCode(int key) {
    return key % SIZE;
}

struct DataItem *search(int key) {
    int hashIndex = hashCode(key);
    int start = hashIndex, probes = 0;

    while (probes < SIZE) {
        if (hashArray[hashIndex].key == EMPTY_KEY) {
            return NULL;
        }
        if (hashArray[hashIndex].key == key) {
            return &hashArray[hashIndex];
        }
        hashIndex = (hashIndex + 1) % SIZE;
        probes++;
        if (hashIndex == start) break;
    }
    return NULL;
}

void insert(int key, int data) {
    struct DataItem item;
    item.data = data;
    item.key = key;

    int hashIndex = hashCode(key);
    int start = hashIndex, probes = 0;

    while (probes < SIZE) {
        if (hashArray[hashIndex].key == EMPTY_KEY || hashArray[hashIndex].key == DELETED_KEY) {
            hashArray[hashIndex] = item;
            printf("Station %d (%.1fC) stored at index %d\n", key, data / 10.0, hashIndex);
            return;
        }
        hashIndex = (hashIndex + 1) % SIZE;
        probes++;
        if (hashIndex == start) break;
    }
    printf("Hash table full. Could not store station %d\n", key);
}

struct DataItem *deleteItem(int key) {
    int hashIndex = hashCode(key);
    int start = hashIndex, probes = 0;

    while (probes < SIZE) {
        if (hashArray[hashIndex].key == EMPTY_KEY) {
            printf("Station %d not found; nothing deleted.\n", key);
            return NULL;
        }
        if (hashArray[hashIndex].key == key) {
            struct DataItem *temp = &hashArray[hashIndex];
            hashArray[hashIndex] = dummyItem;
            printf("Removed station %d from index %d\n", key, hashIndex);
            return temp;
        }
        hashIndex = (hashIndex + 1) % SIZE;
        probes++;
        if (hashIndex == start) break;
    }
    printf("Station %d not found; nothing deleted.\n", key);
    return NULL;
}

void display(void) {
    int i;
    printf("\n--- Station Hash Table (index : station_id -> temp C) ---\n");
    for (i = 0; i < SIZE; i++) {
        if (hashArray[i].key == EMPTY_KEY) {
            printf("%d : empty\n", i);
        } else if (hashArray[i].key == DELETED_KEY) {
            printf("%d : deleted\n", i);
        } else {
            printf("%d : %d -> %.1f\n", i, hashArray[i].key, hashArray[i].data / 10.0);
        }
    }
}

int main(void) {
    int i, choice, key, tempTenths;

    for (i = 0; i < SIZE; i++) {
        hashArray[i].key = EMPTY_KEY;
        hashArray[i].data = 0;
    }
    dummyItem.key = DELETED_KEY;
    dummyItem.data = 0;

    while (1) {
        printf("\n1. Insert  2. Search  3. Delete  4. Display  5. Exit\nChoice: ");
        if (scanf("%d", &choice) != 1) break;

        switch (choice) {
            case 1: {
                printf("Station ID (key): "); scanf("%d", &key);
                printf("Temperature C (e.g. 45.2): ");
                float t;
                scanf("%f", &t);
                tempTenths = (int)(t * 10);
                insert(key, tempTenths);
                break;
            }
            case 2: {
                printf("Search station ID: "); scanf("%d", &key);
                struct DataItem *found = search(key);
                if (found) {
                    printf("Station %d: %.1fC\n", found->key, found->data / 10.0);
                } else {
                    printf("Station %d not found.\n", key);
                }
                break;
            }
            case 3:
                printf("Delete station ID: "); scanf("%d", &key);
                deleteItem(key);
                break;
            case 4:
                display();
                break;
            case 5:
                return 0;
            default:
                printf("Invalid choice.\n");
        }
    }
    return 0;
}
