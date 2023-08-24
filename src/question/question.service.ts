import { Injectable } from "@nestjs/common";
import { allData } from "src/util/data";
import { ResponseController } from "src/util/response.controller";

@Injectable()
export class QuestionService {
  findAll() {
    function getRandomItemsFromArray(array, numberOfItems) {
      if (numberOfItems > array.length) {
        throw new Error("Number of items requested exceeds array length");
      }

      const shuffledArray = array.slice(); // Copy the array
      for (let i = shuffledArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledArray[i], shuffledArray[j]] = [
          shuffledArray[j],
          shuffledArray[i],
        ]; // Swap elements
      }

      return shuffledArray.slice(0, numberOfItems);
    }

    const randomItems = getRandomItemsFromArray(allData, 10);

    return randomItems;
    // const index = allData.findIndex((obj: any) => obj.type === "number");
    // return [allData[index]];
    //
  }

  findOne(id: number) {
    return `This action returns a #${id} question`;
  }

  remove(id: number) {
    return `This action removes a #${id} question`;
  }
}
