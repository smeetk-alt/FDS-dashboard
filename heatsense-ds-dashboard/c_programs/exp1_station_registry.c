/*
 * Experiment 1: Arrays, Array of Structure and Pointers
 * HeatSense use case: a "station registry" of weather stations (roll-call list
 * pattern from the lab doc, applied to station_id/name instead of roll/name).
 * Supports: insert at last position, delete from last position,
 * search a specific station, display the complete list.
 */
#include <stdio.h>
#include <string.h>

#define MAX 50

struct Station {
    int station_id;
    char name[30];
    float temperature;
};

struct Station registry[MAX];
int count = 0;

void insertLast(int id, const char *name, float temp) {
    if (count >= MAX) {
        printf("Registry full.\n");
        return;
    }
    registry[count].station_id = id;
    strcpy(registry[count].name, name);
    registry[count].temperature = temp;
    count++;
}

void deleteLast(void) {
    if (count == 0) {
        printf("Registry empty.\n");
        return;
    }
    count--;
    printf("Removed station %d (%s)\n", registry[count].station_id, registry[count].name);
}

struct Station *search(int id) {
    int i;
    for (i = 0; i < count; i++) {
        if (registry[i].station_id == id) {
            return &registry[i];
        }
    }
    return NULL;
}

void display(void) {
    int i;
    printf("\n%-5s %-15s %-10s\n", "ID", "Name", "Temp(C)");
    for (i = 0; i < count; i++) {
        printf("%-5d %-15s %-10.1f\n", registry[i].station_id, registry[i].name, registry[i].temperature);
    }
}

int main(void) {
    int choice, id;
    char name[30];
    float temp;
    struct Station *found;

    while (1) {
        printf("\n1. Insert  2. Delete Last  3. Search  4. Display  5. Exit\nChoice: ");
        if (scanf("%d", &choice) != 1) break;

        switch (choice) {
            case 1:
                printf("Station ID: "); scanf("%d", &id);
                printf("Name: "); scanf("%s", name);
                printf("Temperature: "); scanf("%f", &temp);
                insertLast(id, name, temp);
                break;
            case 2:
                deleteLast();
                break;
            case 3:
                printf("Search ID: "); scanf("%d", &id);
                found = search(id);
                if (found) {
                    printf("Found: %s, %.1f C\n", found->name, found->temperature);
                } else {
                    printf("Station not found.\n");
                }
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
