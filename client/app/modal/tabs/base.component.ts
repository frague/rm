export abstract class BaseTabComponent {
  isLoading = false;
  
  fetchData() {

  }

  ngOnInit() {
    this.fetchData();
  }
}