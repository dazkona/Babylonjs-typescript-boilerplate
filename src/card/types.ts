export type CreateRoundBoxPayload = {
	thickness: number, 
	roundCornerRadius: number, 
	width: number,
	height: number
};

export type CardTextPayload = {
	title: string,
	subtitle: string[],
	id: string,
	borderLabel: string
};