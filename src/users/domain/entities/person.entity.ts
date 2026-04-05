export class Person {
  id?: string; // Optional (auto-generated)
  documentType: string;
  documentNumber: string;
  firstName: string;
  lastName: string;
  birthday: Date | null;

  constructor(
    documentType: string,
    documentNumber: string,
    firstName: string,
    lastName: string,
    birthday: Date | null,
    id?: string,
  ) {
    this.documentType = documentType;
    this.documentNumber = documentNumber;
    this.firstName = firstName;
    this.lastName = lastName;
    this.birthday = birthday;
    this.id = id;
  }
}
