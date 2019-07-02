export var Utils = {
  leadingZero: (value: number): string => {
    return ('0' + value).substr(-2);
  },
  isTrue: (value: any): boolean => {
    return [true, 'true'].includes(value);
  },
  cleanupJvStatus: (status: string): string => {
    return (status || '').replace(/^\d{2} /, '');
  }
};
