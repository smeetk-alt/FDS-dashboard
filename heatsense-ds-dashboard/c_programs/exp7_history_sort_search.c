/*
 * Experiment 7: Sorting & Binary Search
 * HeatSense use case: historical daily max-temperature records are sorted
 * (quicksort), then binary search finds whether a given temperature occurred.
 */
#include <stdio.h>

void swap(float *a, float *b) {
    float t = *a;
    *a = *b;
    *b = t;
}

int partition(float arr[], int low, int high) {
    float pivot = arr[high];
    int i = low - 1, j;

    for (j = low; j < high; j++) {
        if (arr[j] <= pivot) {
            i++;
            swap(&arr[i], &arr[j]);
        }
    }
    swap(&arr[i + 1], &arr[high]);
    return i + 1;
}

void quickSort(float arr[], int low, int high) {
    int pi;
    if (low < high) {
        pi = partition(arr, low, high);
        quickSort(arr, low, pi - 1);
        quickSort(arr, pi + 1, high);
    }
}

int binarySearch(float arr[], int n, float key) {
    int low = 0, high = n - 1, mid;
    while (low <= high) {
        mid = (low + high) / 2;
        if (arr[mid] == key) {
            return mid;
        } else if (arr[mid] < key) {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }
    return -1;
}

int main(void) {
    float records[100], key;
    int n, i, index;

    printf("Number of historical records: ");
    scanf("%d", &n);

    printf("Enter %d max-temperature readings:\n", n);
    for (i = 0; i < n; i++) {
        scanf("%f", &records[i]);
    }

    quickSort(records, 0, n - 1);

    printf("Sorted records: ");
    for (i = 0; i < n; i++) {
        printf("%.1f ", records[i]);
    }
    printf("\n");

    printf("Search for temperature: ");
    scanf("%f", &key);

    index = binarySearch(records, n, key);
    if (index != -1) {
        printf("%.1f found at sorted position %d\n", key, index);
    } else {
        printf("%.1f not found in historical records.\n", key);
    }

    return 0;
}
